import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface MenuCategoryFilterProps {
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export function MenuCategoryFilter({ activeCategory, onCategoryChange }: MenuCategoryFilterProps) {
  const categories = [
    { id: null, name: "Todos" },
    { id: "breakfast", name: "Desayuno" },
    { id: "lunch", name: "Almuerzo" },
    { id: "dinner", name: "Cena" },
    { id: "beverages", name: "Bebidas" },
    { id: "desserts", name: "Postres" },
  ];

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex space-x-2 pb-2">
        {categories.map((category) => (
          <Button
            key={category.id === null ? "all" : category.id}
            variant={activeCategory === category.id ? "default" : "outline"}
            className={
              activeCategory === category.id
                ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                : ""
            }
            onClick={() => onCategoryChange(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
