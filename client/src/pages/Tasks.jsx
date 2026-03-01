import Navbar from "../components/NavBar";
import SideBar from "../components/SideBar";

/**
 * Tasks page
 *
 * Main authenticated landing page.
 */
const Tasks = () => {
  return (
    <>
      {/* <Navbar /> */}
      <SideBar />
      <div className="tasks" />
    </>
  );
};

export default Tasks;
