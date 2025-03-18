import {
  useSensor,
  useSensors,
  KeyboardSensor,
  TouchSensor,
  MouseSensor,
} from "@dnd-kit/core";
import { coordinateGetter } from "../multipleContainersKeyboardPreset";

export function useBoardSensors() {
  return useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: coordinateGetter,
    })
  );
}
