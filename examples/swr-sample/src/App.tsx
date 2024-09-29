import "@arco-design/web-react/dist/css/arco.min.css";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { SWRConfig, SWRConfiguration } from "swr";
import { Pets as PontxPets } from "./pets/PontxPets.component";
import { Pets as SWRPets } from "./pets/SWRPets.component";

const DEFAULT_SWR_CONFIG = {
  shouldRetryOnError: false,
  revalidateOnFocus: false,
  dedupingInterval: 60,
  keepPreviousData: true,
} as SWRConfiguration;

function App() {
  return (
    <>
      <h1>Vite + React</h1>
      <SWRConfig value={DEFAULT_SWR_CONFIG}>
        <div className='card flex justify-between'>
          <PontxPets />
          <SWRPets />
        </div>
      </SWRConfig>
    </>
  );
}

export default App;
