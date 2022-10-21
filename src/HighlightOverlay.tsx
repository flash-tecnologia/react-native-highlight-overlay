import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { ClipPath, Defs, Path, Rect } from "react-native-svg";

import constructClipPath from "./constructClipPath";
import { useHighlightableElements } from "./context";
import type { Bounds } from "./context/context";

const DEFAULT_OVERLAY_STYLE: Required<OverlayStyle> = {
	color: "black",
	opacity: 0.7,
};

export type OverlayStyle = {
	/**
	 * The color of the overlay. Should not include alpha in the color, use `opacity` prop for that.
	 *
	 * @default "black"
	 * @since 1.3
	 */
	color?: string;

	/**
	 * The opacity of the overlay color.
	 *
	 * @default 0.7
	 * @since 1.3
	 */
	opacity?: number;
};

export type HighlightOverlayProps = {
	/**
	 * The id of the highlighted element. If `undefined`, `null`, or if the id does not exist,
	 * the overlay is hidden.
	 *
	 * @since 1.0
	 */
	highlightedElementId?: string | null;

	/**
	 * Called when the highlight is requesting to be dismissed. This is usually when the overlay
	 * (non-highlighted) part of the screen is pressed. The exact behavior is decided by each
	 * HighlightableElement.
	 *
	 * @since 1.0
	 */
	onDismiss: () => void;

	/**
	 * The style of the overlay.
	 *
	 * @default { color: "black", opacity: 0.7 }
	 * @since 1.3
	 */
	overlayStyle?: OverlayStyle;
};

/**
 * An overlay that optionally takes the id of a `HighlightableElement` to highlight
 * (exclude from the overlay). This is not a modal, so it should be placed on top of all elements
 * you want it to cover.
 *
 * **NOTE:** If the highlighted element is inside of a `ScrollView`, the `HighlightOverlay` should also
 * be inside of that scroll view to ensure that the highlight is correctly placed.
 *
 * @since 1.0
 */
function HighlightOverlay({
	highlightedElementId,
	onDismiss,
	overlayStyle = DEFAULT_OVERLAY_STYLE,
}: HighlightOverlayProps) {
	const [elements, { setCurrentActiveOverlay }] = useHighlightableElements();
	const [parentSize, setParentSize] = useState<Bounds | null>();

	const highlightedElementData = useMemo(
		() => (highlightedElementId != null ? elements[highlightedElementId] : null),
		[elements, highlightedElementId]
	);

	const hasContent = highlightedElementData != null && parentSize != null;
	const clickThrough = highlightedElementData?.options?.clickthroughHighlight ?? true;
	const { color = DEFAULT_OVERLAY_STYLE.color, opacity = DEFAULT_OVERLAY_STYLE.opacity } =
		overlayStyle;

	useEffect(() => {
		setCurrentActiveOverlay(
			highlightedElementId == null ? null : { color, opacity, onDismiss }
		);
		// Dependency array should NOT include `onDismiss` prop
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [color, highlightedElementId, opacity, setCurrentActiveOverlay]);

	return (
		<View
			style={StyleSheet.absoluteFill}
			onLayout={({ nativeEvent: { layout } }) => setParentSize(layout)}
			pointerEvents="box-none"
		>
			{hasContent && (
				<Svg
					key={highlightedElementId}
					pointerEvents={clickThrough ? "none" : "auto"}
					onPress={!clickThrough ? onDismiss : undefined}
					style={StyleSheet.absoluteFill}
				>
					<Defs>
						{Object.entries(elements).map(([id, element]) => (
							<ClipPath key={id} id={id}>
								<Path
									d={constructClipPath(element, parentSize)}
									clipRule="evenodd"
								/>
							</ClipPath>
						))}
					</Defs>
					<Rect
						x={0}
						y={0}
						width="100%"
						height="100%"
						clipPath={`#${highlightedElementId}`}
						fill={color}
						fillOpacity={opacity}
					/>
				</Svg>
			)}
		</View>
	);
}

export default React.memo(
	HighlightOverlay,
	(prevProps, nextProps) =>
		// We need this here so we don't check the `onDismiss` prop.
		prevProps.highlightedElementId === nextProps.highlightedElementId &&
		prevProps.overlayStyle?.color === nextProps.overlayStyle?.color &&
		prevProps.overlayStyle?.opacity === nextProps.overlayStyle?.opacity
);
