import InteractiveMap from "./InteractiveMap";

export default function FieldMap() {
  console.log("🔧 FIELDMAP: FieldMap component mounting");
  console.log("🔧 FIELDMAP: About to render InteractiveMap");
  return <InteractiveMap height="600px" showFieldDetails={true} />;
}