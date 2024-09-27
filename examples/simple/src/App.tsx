import "./App.css";
import "@arco-design/web-react/dist/css/arco.min.css";
import { TodosRoot } from "./Todos/Todos.component";

function App() {
  return (
    <div className='bg-white w-[100vw] h-[100vh]'>
      <div className='relative mx-auto mt-[100px] w-[700px]'>
        <TodosRoot />
      </div>
    </div>
  );
}

export default App;
