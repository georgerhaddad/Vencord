/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { Tooltip } from "@webpack/common";

function voidPromise<T>(promise: Promise<T> | undefined) {
    promise?.catch(() => {});
}

function enterFullscreen(wrapper: HTMLElement | null, video: HTMLVideoElement, allowFallback: boolean) {
    if (wrapper?.getAttribute("data-fullscreen") === "true")
        return true;

    const fullscreenButton = wrapper?.querySelector('button[aria-label="Full screen"]') as HTMLButtonElement | null;
    if (fullscreenButton) {
        fullscreenButton.click();
        return true;
    }

    if (allowFallback) {
        voidPromise((wrapper ?? video).requestFullscreen?.());
        return true;
    }

    return false;
}

export default definePlugin({
    name: "AutoFullscreenVideo",
    description: "Adds a fullscreen play button to uploaded videos next to the Download button",
    tags: ["Media", "Utility"],
    authors: [Devs.GeorgeHaddad],
    patches: [
        {
            find: '["VIDEO","CLIP","AUDIO"]',
            replacement: [
                {
                    match: /(\[\i>0&&\i\.length>0.{0,150}?children:\[)(?<=showDownload:(\i).+?isVisualMediaType:(\i).+?)/,
                    replace: (_, rest, showDownload, isVisualMediaType) => `${rest}${showDownload}&&${isVisualMediaType}&&$self.AutoFullscreenButton(),`
                },
                {
                    match: /(\[\i>0&&\i\.length>0.{0,150}?children:)(\i.slice\(\i\))(?<=showDownload:(\i).+?isVisualMediaType:(\i).+?)/,
                    replace: (_, rest, origChildren, showDownload, isVisualMediaType) => `${rest}[${showDownload}&&${isVisualMediaType}&&$self.AutoFullscreenButton(),...${origChildren}]`
                }
            ]
        }
    ],

    AutoFullscreenButton: ErrorBoundary.wrap(() => {
        return (
            <Tooltip text="Play Fullscreen">
                {tooltipProps => (
                    <div
                        {...tooltipProps}
                        className="vc-auto-fullscreen-button"
                        role="button"
                        aria-label="Play Fullscreen"
                        style={{
                            cursor: "pointer",
                            paddingTop: "4px",
                            paddingLeft: "4px",
                            paddingRight: "4px",
                        }}
                        onClick={e => {
                            e.stopPropagation();

                            const video = e.currentTarget.parentElement?.parentElement?.querySelector("video") as HTMLVideoElement | null;
                            if (!video) return;

                            const wrapper = video.closest("[data-fullscreen]") as HTMLElement | null;
                            const playButton = wrapper?.querySelector('[aria-label="Play"][role="button"],[aria-label="Play again"][role="button"]') as HTMLElement | null;

                            if (video.paused) {
                                if (playButton) {
                                    playButton.click();

                                    requestAnimationFrame(() => {
                                        if (!enterFullscreen(wrapper, video, false))
                                            requestAnimationFrame(() => enterFullscreen(wrapper, video, true));
                                    });
                                    return;
                                }

                                voidPromise(video.play());
                            }

                            enterFullscreen(wrapper, video, true);
                        }}
                    >
                        <svg width="24px" height="24px" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M4 4h6v2H6v4H4V4Zm10 0h6v6h-2V6h-4V4ZM4 14h2v4h4v2H4v-6Zm14 0h2v6h-6v-2h4v-4Z"
                            />
                        </svg>
                    </div>
                )}
            </Tooltip>
        );
    }, { noop: true })
});
