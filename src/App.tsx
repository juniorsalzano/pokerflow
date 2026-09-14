import { Route, Routes } from "react-router-dom";
import CreateRoomPage from "./pages/CreateRoomPage";
import RoomPage from "./pages/RoomPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CreateRoomPage />} />
      <Route path="/sala/:codigo" element={<RoomPage />} />
    </Routes>
  );
}
