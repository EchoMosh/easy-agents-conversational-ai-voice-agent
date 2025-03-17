
import {
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { coordinateGetter } from "../utils";

export function useBoardSensors() {
  // Use more sensitive sensors for easier drag/drop
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 2, // Reduced for more sensitive dragging
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 50, // Reduced delay for more responsive touch
        tolerance: 5, // Allow some movement during press before canceling
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter,
    })
  );

  return sensors;
}
