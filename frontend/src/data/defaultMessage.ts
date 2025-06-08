import { MessageType } from "@/types/tutor/chat";

export const defaultMessage: MessageType = {
  id: "default",
  role: "assistant",
  content: `Hello! I'm here to help you learn the basic physics of a couple of scenes.

  You'll see a free body diagram on the left.

  Free body diagrams are a tool for visualizing the forces acting on an object, and
  are used in introductory physics to build intuition.

 I can help you by: 
 - walking through force balancing math, or determine how the body will move if the forces are unbalanced
 - explaining what each force in the diagram represents
 - creating a diagram for a scene of your own description (though be warned, I'm limited to simple physics problems, for now)
 - decomposing forces into their components
 - and more, just ask! `,
};
