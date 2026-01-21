import { render, screen, fireEvent } from "@testing-library/react";
import { CategorySelector } from "./CategorySelector";

const categories = [
  { id: "1", name: "EMERALD" },
  { id: "2", name: "RUBY" },
];

test("selects category correctly", () => {
  const onChange = vi.fn();

  render(
    <CategorySelector
      categories={categories}
      value=""
      onChange={onChange}
    />
  );

  fireEvent.click(screen.getByText("Select category"));
  fireEvent.click(screen.getByText("EMERALD"));

  expect(onChange).toHaveBeenCalledWith("1");
});