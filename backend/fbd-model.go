package main

// ---------- primitive enums ----------
type ForceType string

const (
	Applied     ForceType = "applied"
	Reaction    ForceType = "reaction"
	Component   ForceType = "component"
	Net         ForceType = "net"
	Fictitious  ForceType = "fictitious"
)

type Location string

const (
	Top      Location = "top"
	Bottom   Location = "bottom"
	Left     Location = "left"
	Right    Location = "right"
	Centroid Location = "centroid"
)

type BodyShape string

const (
	Rect   BodyShape = "rect"
	Circle BodyShape = "circle"
)

type MomentDirection string

const (
	Clockwise        MomentDirection = "cw"
	CounterClockwise MomentDirection = "ccw"
)

// ---------- payload structs ----------
type Body struct {
	ID    string    `json:"id" validate:"required"`
	Shape BodyShape `json:"shape" validate:"required,oneof=rect circle" jsonschema:"enum=rect,enum=circle"`
	Angle float64   `json:"angle" validate:"required"` // degrees
}

type Force struct {
	Label     string    `json:"label" validate:"required"`
	Name      string    `json:"name"  validate:"required"`
	Unit      string    `json:"unit"  validate:"required"`
	Magnitude float64   `json:"magnitude" validate:"required"`
	Angle     float64   `json:"angle" validate:"required"` // degrees
	Location  Location  `json:"location" validate:"required,oneof=centroid top bottom left right" jsonschema:"enum=centroid,enum=top,enum=bottom,enum=left,enum=right"`
	Type      ForceType `json:"type" validate:"required,oneof=applied reaction component net fictitious" jsonschema:"enum=applied,enum=reaction,enum=component,enum=net,enum=fictitious"`
}

type Moment struct {
	Label     string          `json:"label" validate:"required"`
	Name      string          `json:"name"  validate:"required"`
	Unit      string          `json:"unit"  validate:"required"`
	Magnitude float64         `json:"magnitude" validate:"required"`
	Direction MomentDirection `json:"direction" validate:"required,oneof=cw ccw" jsonschema:"enum=cw,enum=ccw"`
	Location  Location        `json:"location" validate:"required,oneof=centroid top bottom left right" jsonschema:"enum=centroid,enum=top,enum=bottom,enum=left,enum=right"`
}

type Axes struct {
	Rotation float64 `json:"rotation" validate:"required"` // degrees
}

type Fbd struct {
	Body    Body     `json:"body"    validate:"required"`
	Forces  []Force  `json:"forces"  validate:"required"`
	Moments []Moment `json:"moments" validate:"required"`
	Axes    Axes     `json:"axes"    validate:"required"`
}
