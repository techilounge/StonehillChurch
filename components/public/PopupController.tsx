import { getActivePopup } from "@/lib/data/popups";
import { DynamicPopup } from "./DynamicPopup";

export async function PopupController() {
  const popup = await getActivePopup();
  if (!popup) return null;
  return <DynamicPopup popup={popup} />;
}
