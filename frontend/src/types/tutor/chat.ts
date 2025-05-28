export type Role = "user" | "assistant";

export interface MessageType {
  id: string;
  role: Role;
  content: string;
}
