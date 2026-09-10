import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  "house.fill": "home",
  "pawprint.fill": "pets",
  "clock.arrow.circlepath": "history",
  "ellipsis": "more-horiz",
  "pills.fill": "medication",
  "clock.fill": "schedule",
  "checkmark.circle.fill": "check-circle",
  "circle": "radio-button-unchecked",
  "exclamationmark.triangle.fill": "warning",
  "minus": "remove",
  "arrow.triangle.2.circlepath": "autorenew",
  "plus": "add",
  "pencil": "edit",
  "trash": "delete-outline",
  "chevron.left": "chevron-left",
  "chevron.right": "chevron-right",
  "bell.fill": "notifications-none",
  "person.fill": "person-outline",
  "calendar": "calendar-today",
  "fork.knife": "restaurant",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
