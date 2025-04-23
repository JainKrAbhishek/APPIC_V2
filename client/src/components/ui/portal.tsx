import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  /**
   * The content to be rendered in the portal
   */
  children: React.ReactNode;
  /**
   * The element to mount the portal to
   */
  container?: HTMLElement | null;
  /**
   * Whether to disable the portal
   */
  disabled?: boolean;
}

/**
 * A component that uses React's createPortal to render children into a different part of the DOM.
 * Useful for modals, tooltips, and other overlays.
 */
export function Portal({
  children,
  container,
  disabled = false,
}: PortalProps) {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (disabled) {
      setMountNode(null);
      return;
    }

    // Use the specified container, or default to document.body
    setMountNode(container || document.body);
  }, [container, disabled]);

  // If no mount node, render children inline
  if (disabled || !mountNode) {
    return <>{children}</>;
  }

  // Otherwise, use createPortal
  return createPortal(children, mountNode);
}

interface PositionedPortalProps extends PortalProps {
  /**
   * Reference element to position the portal relative to
   */
  referenceElement?: HTMLElement | null;
  /**
   * Position of the portal relative to the reference element
   */
  position?: "top" | "right" | "bottom" | "left" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /**
   * Offset from the reference element in pixels
   */
  offset?: number;
  /**
   * Whether to update the position on scroll
   */
  updateOnScroll?: boolean;
  /**
   * Whether to update the position on resize
   */
  updateOnResize?: boolean;
  /**
   * z-index of the portal
   */
  zIndex?: number;
}

/**
 * A portal that positions itself relative to a reference element
 */
export function PositionedPortal({
  children,
  container,
  disabled = false,
  referenceElement,
  position = "bottom",
  offset = 8,
  updateOnScroll = true,
  updateOnResize = true,
  zIndex = 50,
}: PositionedPortalProps) {
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null);

  // Update the position when needed
  const updatePosition = () => {
    if (!portalElement || !referenceElement) return;

    const referenceRect = referenceElement.getBoundingClientRect();
    
    // Position based on the reference element
    switch (position) {
      case "top":
        portalElement.style.top = `${window.scrollY + referenceRect.top - portalElement.offsetHeight - offset}px`;
        portalElement.style.left = `${window.scrollX + referenceRect.left + (referenceRect.width / 2) - (portalElement.offsetWidth / 2)}px`;
        break;
      case "right":
        portalElement.style.top = `${window.scrollY + referenceRect.top + (referenceRect.height / 2) - (portalElement.offsetHeight / 2)}px`;
        portalElement.style.left = `${window.scrollX + referenceRect.right + offset}px`;
        break;
      case "bottom":
        portalElement.style.top = `${window.scrollY + referenceRect.bottom + offset}px`;
        portalElement.style.left = `${window.scrollX + referenceRect.left + (referenceRect.width / 2) - (portalElement.offsetWidth / 2)}px`;
        break;
      case "left":
        portalElement.style.top = `${window.scrollY + referenceRect.top + (referenceRect.height / 2) - (portalElement.offsetHeight / 2)}px`;
        portalElement.style.left = `${window.scrollX + referenceRect.left - portalElement.offsetWidth - offset}px`;
        break;
      case "top-left":
        portalElement.style.top = `${window.scrollY + referenceRect.top - portalElement.offsetHeight - offset}px`;
        portalElement.style.left = `${window.scrollX + referenceRect.left}px`;
        break;
      case "top-right":
        portalElement.style.top = `${window.scrollY + referenceRect.top - portalElement.offsetHeight - offset}px`;
        portalElement.style.left = `${window.scrollX + referenceRect.right - portalElement.offsetWidth}px`;
        break;
      case "bottom-left":
        portalElement.style.top = `${window.scrollY + referenceRect.bottom + offset}px`;
        portalElement.style.left = `${window.scrollX + referenceRect.left}px`;
        break;
      case "bottom-right":
        portalElement.style.top = `${window.scrollY + referenceRect.bottom + offset}px`;
        portalElement.style.left = `${window.scrollX + referenceRect.right - portalElement.offsetWidth}px`;
        break;
      default:
        break;
    }
  };

  // Set up event listeners for position updates
  useEffect(() => {
    if (disabled || !portalElement || !referenceElement) return;

    // Initial position
    updatePosition();

    // Set up event listeners for position updates
    const handleScroll = () => {
      if (updateOnScroll) {
        updatePosition();
      }
    };

    const handleResize = () => {
      if (updateOnResize) {
        updatePosition();
      }
    };

    if (updateOnScroll) {
      window.addEventListener("scroll", handleScroll, true);
    }

    if (updateOnResize) {
      window.addEventListener("resize", handleResize);
    }

    // Clean up event listeners
    return () => {
      if (updateOnScroll) {
        window.removeEventListener("scroll", handleScroll, true);
      }
      if (updateOnResize) {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, [
    disabled,
    portalElement,
    referenceElement,
    position,
    offset,
    updateOnScroll,
    updateOnResize,
  ]);

  const content = (
    <div
      ref={setPortalElement}
      style={{
        position: "absolute",
        zIndex,
      }}
    >
      {children}
    </div>
  );

  return (
    <Portal container={container} disabled={disabled}>
      {content}
    </Portal>
  );
}