import { render, screen } from "@testing-library/react";
import Inventory from "./Inventory";

test("renders inventory page", async () => {
  render(<Inventory />);

  expect(await screen.findByText("Inventory")).toBeInTheDocument();
});