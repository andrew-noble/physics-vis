import { MessageType } from "@/types/tutor/chat";

export const defaultMessage: MessageType = {
  id: "default",
  role: "assistant",
  content: `Hello! I'm here to help you learn physics. There should be a free body diagram shown, let me know what you'd like to learn about it.
    
 I can help you by: 
 - walking through force balancing math, or determine movement if the forces are unbalanced
 - explaining what each arrow in the diagram represents
 - creating a diagram for a scene of your own description (though be warned, I'm limited to simple physics problems, for now) 
 - and more, just ask! `,
};
