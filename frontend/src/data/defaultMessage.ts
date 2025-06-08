import { MessageType } from "@/types/tutor/chat";

export const defaultMessage: MessageType = {
  id: "default",
  role: "assistant",
  content: `Hello! I'm here to help you learn physics. There should be a free body diagram shown, let me know what you'd like to learn about it.
    
 I can help you by: 
 - drawing a free body diagram that represents a situation of your choosing
 - walking through the math to calculate how forces balance
 - explaining what each arrow in the diagram represents
 - and more, just ask! `,
};
