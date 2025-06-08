const carScene = `A car is driving fast around a curve in a track. 
The car has a mass of 1000 kg and is moving at a linear speed of 10 m/s.
In this scene, we want to teach the student about centripetal force, so there should be a fricitonal force allowing the car to turn.
Do not forget to add in weight and normal force arrows.`;

const pendulumScene = `A pendulum is swinging back and forth. 
The pendulum has a mass of 1 kg and is 1 m long.
In this scene, we want to teach the student about angular momentum. Make absolutely certain the diagram has a tension force at the top of the pendulum, angled to one side.`;

const blockScene = `A block is resting on an INCLINED 30 degree surface with a coefficient of friction of 0.2. The block has a mass of 3 kg.
This is a classic statics scene to teach force decomposition.`;

export const sceneDescriptions = {
  block: blockScene,
  car: carScene,
  pendulum: pendulumScene,
};
