import React, { useEffect, useCallback, useRef } from "react";
import {
	DailyAudioTrack,
	DailyVideo,
	useDaily,
	useDevices,
	useLocalSessionId,
	useMeetingState,
	useScreenVideoTrack,
	useVideoTrack
} from "@daily-co/daily-react";
import { MicSelectBtn, CameraSelectBtn, ScreenShareButton } from '../device-select'
import { useLocalScreenshare } from "../../hooks/use-local-screenshare";
import { useReplicaIDs } from "../../hooks/use-replica-ids";
import { useCVICall } from "../../hooks/use-cvi-call";
import { AudioWave } from "../audio-wave";

import styles from "./conversation.module.css";

type LeaveReason = "client_closed" | "error";

interface ConversationProps {
	onLeave: (options?: { endReason?: LeaveReason; errorMessage?: string }) => void;
	conversationUrl: string;
}

const DEFAULT_JOIN_ERROR_MESSAGE =
	"The live preview could not be joined right now. Please try starting a new session.";

function getDailyErrorMessage(error: unknown): string {
	if (
		error &&
		typeof error === "object" &&
		"errorMsg" in error &&
		typeof error.errorMsg === "string" &&
		error.errorMsg.trim()
	) {
		if (error.errorMsg === "You are not allowed to join this meeting") {
			return "The live preview could not be joined right now. Please start a new session.";
		}

		return error.errorMsg;
	}

	if (error instanceof Error && error.message.trim()) {
		return error.message;
	}

	return DEFAULT_JOIN_ERROR_MESSAGE;
}

const VideoPreview = React.memo(({ id }: { id: string }) => {
	const videoState = useVideoTrack(id);
	const widthVideo = videoState.track?.getSettings()?.width;
	const heightVideo = videoState.track?.getSettings()?.height;
	const isVertical = widthVideo && heightVideo ? widthVideo < heightVideo : false;

	return (
		<div
			className={`${styles.previewVideoContainer} ${isVertical ? styles.previewVideoContainerVertical : ''} ${videoState.isOff ? styles.previewVideoContainerHidden : ''}`}
		>
			<DailyVideo
				automirror
				sessionId={id}
				type="video"
				className={`${styles.previewVideo} ${isVertical ? styles.previewVideoVertical : ''} ${videoState.isOff ? styles.previewVideoHidden : ''}`}
			/>
			<div className={styles.audioWaveContainer}>
				<AudioWave id={id} />
			</div>
		</div>
	);
});

const PreviewVideos = React.memo(() => {
	const localId = useLocalSessionId();
	const { isScreenSharing } = useLocalScreenshare();
	const replicaIds = useReplicaIDs();
	const replicaId = replicaIds[0];

	return (
		<>
			{isScreenSharing && (
				<VideoPreview id={replicaId} />
			)}
			<VideoPreview id={localId} />
		</>
	);
});

const MainVideo = React.memo(() => {
	const replicaIds = useReplicaIDs();
	const localId = useLocalSessionId();
	const videoState = useVideoTrack(replicaIds[0]);
	const screenVideoState = useScreenVideoTrack(localId);
	const isScreenSharing = !screenVideoState.isOff;
	// This is one-to-one call, so we can use the first replica id
	const replicaId = replicaIds[0];

	if (!replicaId) {
		return (
			<div className={styles.waitingContainer}>
				<p>Connecting...</p>
			</div>
		);
	}

	// Switching between replica video and screen sharing video
	return (
		<div
			className={`${styles.mainVideoContainer} ${isScreenSharing ? styles.mainVideoContainerScreenSharing : ''}`}
		>
			<DailyVideo
				automirror
				sessionId={isScreenSharing ? localId : replicaId}
				type={isScreenSharing ? "screenVideo" : "video"}
				className={`${styles.mainVideo}
				${isScreenSharing ? styles.mainVideoScreenSharing : ''}
				${videoState.isOff ? styles.mainVideoHidden : ''}`}
			/>
			<DailyAudioTrack sessionId={replicaId} />
		</div>
	);
});

export const Conversation = React.memo(({ onLeave, conversationUrl }: ConversationProps) => {
	const { joinCall, leaveCall } = useCVICall();
	const daily = useDaily();
	const meetingState = useMeetingState();
	const { hasMicError } = useDevices();
	const hasLeftRef = useRef(false);

	const handleLeave = useCallback((options?: { endReason?: LeaveReason; errorMessage?: string }) => {
		if (hasLeftRef.current) {
			return;
		}

		hasLeftRef.current = true;
		leaveCall();
		onLeave(options);
	}, [leaveCall, onLeave]);

	useEffect(() => {
		if (meetingState === 'error') {
			handleLeave({
				endReason: "error",
				errorMessage: DEFAULT_JOIN_ERROR_MESSAGE,
			});
		}
	}, [handleLeave, meetingState]);

	useEffect(() => {
		if (!daily) {
			return;
		}

		const handleDailyError = (event: unknown) => {
			handleLeave({
				endReason: "error",
				errorMessage: getDailyErrorMessage(event),
			});
		};

		daily.on("error", handleDailyError);
		return () => {
			daily.off("error", handleDailyError);
		};
	}, [daily, handleLeave]);

	// Initialize call when conversation is available
	useEffect(() => {
		let isMounted = true;
		hasLeftRef.current = false;

		void joinCall({ url: conversationUrl }).catch((error) => {
			if (!isMounted) {
				return;
			}

			handleLeave({
				endReason: "error",
				errorMessage: getDailyErrorMessage(error),
			});
		});

		return () => {
			isMounted = false;
			leaveCall();
		};
	}, [conversationUrl, handleLeave, joinCall, leaveCall]);

	return (
		<div className={styles.container}>
			<div className={styles.videoContainer}>
				{
					hasMicError && (
						<div className={styles.errorContainer}>
							<p>
								Camera or microphone access denied. Please check your settings and try again.
							</p>
						</div>
					)}

				{/* Main video */}
				<div className={styles.mainVideoContainer}>
					<MainVideo />
				</div>

				{/* Self view */}
				<div className={styles.selfViewContainer}>
					<PreviewVideos />
				</div>
			</div>

			<div className={styles.footer}>
				<div className={styles.footerControls}>
					<MicSelectBtn />
					<CameraSelectBtn />
					<ScreenShareButton />
					<button
						type="button"
						className={styles.leaveButton}
						onClick={() => handleLeave({ endReason: "client_closed" })}
					>
						<span className={styles.leaveButtonIcon}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								role="img"
								aria-label="Leave Call"
							>
								<path
									d="M18 6L6 18M6 6L18 18"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</span>
					</button>
				</div>
			</div>
		</div>
	);
});
