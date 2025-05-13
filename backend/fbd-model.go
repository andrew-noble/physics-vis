package main

type ForceType string

const (
  Applied     ForceType = "applied"     // External forces (pushes, pulls, gravity)
  Reaction    ForceType = "reaction"    // Normal, friction, support forces
  Component   ForceType = "component"   // Decomposed force (e.g. mg sinθ)
  Net         ForceType = "net"         // Resultant of multiple
  Fictitious  ForceType = "fictitious"  // Centrifugal, Coriolis, etc.
)

// unique golang instrument called a "method receiver"
// this attached an IsValid method to the ForceType enum
// and it travels around with it, too. This is why the (ft ForceType)
// is written like that and not as an input parameter
func (ft ForceType) IsValid() bool {
    switch ft {
    case Applied, Reaction, Component, Net, Fictitious:
        return true
    default:
        return false
    }
}

type Location string

const (
	Top Location = "top"
	Bottom Location = "bottom"
	Left Location = "left"
	Right Location = "right"
	Centroid Location = "centroid"
)

func (l Location) IsValid() bool {
	switch l {
	case Top, Bottom, Left, Right, Centroid:
		return true
	}
	return false
}

type BodyShape string

const (
	Rect BodyShape = "rect"
	Circle BodyShape = "circle"
)

func (bs BodyShape) IsValid() bool {
	switch bs {
	case Rect, Circle:
		return true
	}
	return false
}

type MomentDirection string

const (
	Clockwise MomentDirection = "cw"
	CounterClockwise MomentDirection = "ccw"
)

func (md MomentDirection) IsValid() bool {
	switch md {
	case Clockwise, CounterClockwise:
		return true
	}
	return false
}

type Body struct {
    ID       string  `json:"id" validate:"required"`
    Shape    BodyShape  `json:"shape" validate:"required,oneof=rect circle"`    // e.g. "rect", "circle"
    Angle    float64 `json:"angle" validate:"required"` // degrees
}

type Force struct {
    Label         string    `json:"label" validate:"required"`
    Name          string    `json:"name" validate:"required"`
    Unit          string    `json:"unit" validate:"required"`         // e.g. "N"
    Magnitude     float64   `json:"magnitude" validate:"required"`    // in Unit
    Angle         float64   `json:"angle" validate:"required"` // degrees
    Location      Location    `json:"location" validate:"required,oneof=centroid top bottom left right"`     // e.g. "centroid", "top_face_out"
    Type          ForceType `json:"type" validate:"required,oneof=applied reaction component net fictitious"`         // "real", "component", or "net"
}

type Moment struct {
    Label     string  `json:"label" validate:"required"`
    Name      string  `json:"name" validate:"required"`
    Unit      string  `json:"unit" validate:"required"`     // e.g. "Nm"
    Magnitude float64 `json:"magnitude" validate:"required"`
    Direction MomentDirection  `json:"direction" validate:"required,oneof=cw ccw"` // "cw" or "ccw"
    Location  Location  `json:"location" validate:"required,oneof=centroid top bottom left right"`  // point of application. Constraining this to centroid to start
}

type Axes struct {
    Rotation float64 `json:"rotation" validate:"required"` // coordinate system rotation, degrees
}

type Diagram struct {
    Body    Body     `json:"body" validate:"required"`    // single body
    Forces  []Force  `json:"forces" validate:"required"`  // one or more forces
    Moments []Moment `json:"moments" validate:"required"` // optional moments
    Axes    Axes     `json:"axes" validate:"required"`    // required
}

