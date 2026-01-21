import { render, screen, fireEvent } from "@testing-library/react";
import { ShapeSelector } from "./ShapeSelector";

test("selects shape", () => {
  const onChange = vi.fn();

  render(
    <ShapeSelector
      shapes={[{ shape: "", pieces: 0, weight: 0 }]}
      onChange={onChange}
      isSingleShape
    />
  );

  fireEvent.click(screen.getByText("Select shape"));
  fireEvent.click(screen.getByText("ROUND"));

  expect(onChange).toHaveBeenCalledWith([
    { shape: "ROUND", pieces: 0, weight: 0 },
  ]);
});