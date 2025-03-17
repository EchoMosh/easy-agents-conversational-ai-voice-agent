
import { Active, Over } from "@dnd-kit/core";

// Helper function to check if a draggable item has data
export function hasDraggableData(
  active: Active | Over | null
): active is Active & { data: { current: unknown } } {
  return Boolean(
    active && "data" in active && active.data.current !== null
  );
}

// Keyboard preset for multiple containers
export const coordinateGetter = (
  event: KeyboardEvent,
  { context: { active, droppableRects, droppableContainers, collisionRect } }: any
) => {
  if (event.code === "Space") {
    return { x: 0, y: 0 };
  }

  if (!active || !collisionRect) {
    return;
  }

  const filteredContainers = droppableContainers.filter((container: any) => {
    return container.id !== active.id;
  });

  let closestContainer = filteredContainers[0];
  let closestDistance = Infinity;

  const currentRect = droppableRects.get(active.id);

  filteredContainers.forEach((container: any) => {
    const rect = droppableRects.get(container.id);
    if (!rect) {
      return;
    }

    const distance = Math.sqrt(
      Math.pow(rect.left - currentRect.left, 2) + Math.pow(rect.top - currentRect.top, 2)
    );

    if (distance < closestDistance) {
      closestContainer = container;
      closestDistance = distance;
    }
  });

  if (!closestContainer) {
    return;
  }

  switch (event.code) {
    case "ArrowRight":
      return {
        x: droppableRects.get(closestContainer.id).left + 20,
        y: collisionRect.top,
      };
    case "ArrowLeft":
      return {
        x: droppableRects.get(closestContainer.id).left + 20,
        y: collisionRect.top,
      };
    case "ArrowUp":
      return {
        x: collisionRect.left,
        y: droppableRects.get(closestContainer.id).top + 20,
      };
    case "ArrowDown":
      return {
        x: collisionRect.left,
        y: droppableRects.get(closestContainer.id).top + 20,
      };
  }
};
