import { create, createSWRAction, immutable } from "zustand-oop";
import useSWR from "swr";
import { APIs, setDefaultsAll } from "../apis/sdk";
setDefaultsAll({
  baseURL: "https://petstore.swagger.io/v2",
});

@immutable
export class PetsState {
  status = ["available"] as ("available" | "pending" | "sold")[];

  setStatus(status: PetsState["status"]) {
    this.status = status;
  }

  pontxPets = createSWRAction(
    APIs.petstore.pet.findPetsByStatus.useRequest,
    []
  );

  vanillaSWRPets = createSWRAction((status: PetsState["status"]) => {
    return useSWR(
      `https://petstore.swagger.io/v2/pet/findByStatus?status=${status.join(",")}`,
      (url) => fetch(url).then((res) => res.json())
    );
  }, []);
}

export const PetsStore = create(() => new PetsState());
