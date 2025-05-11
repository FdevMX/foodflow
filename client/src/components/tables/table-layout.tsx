import { Card, CardContent } from "@/components/ui/card";
import { TableItem } from "./table-item";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, Order } from "@shared/schema";

interface TableLayoutProps {
  tables: Table[];
  orders: Order[];
  isLoading: boolean;
  onEdit: (table: Table) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
}

export function TableLayout({
  tables,
  orders,
  isLoading,
  onEdit,
  onDelete,
  onStatusChange,
}: TableLayoutProps) {
  // Map table IDs to their orders
  const tableOrders = new Map<number, Order[]>();
  orders.forEach((order) => {
    if (order.tableId) {
      if (!tableOrders.has(order.tableId)) {
        tableOrders.set(order.tableId, []);
      }
      tableOrders.get(order.tableId)!.push(order);
    }
  });

  return (
    <Card>
      <CardContent className="p-6">
        {/* Restaurant interior layout */}
        <div className="bg-muted/30 p-8 rounded-lg relative min-h-[400px]">
          {/* Background restaurant interior image */}
          <div
            className="absolute inset-0 bg-cover bg-center rounded-lg opacity-10 dark:opacity-5"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')",
            }}
          ></div>

          {/* Table representations */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 relative z-10">
            {isLoading
              ? Array(8)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="relative">
                    <Skeleton className="w-full aspect-square rounded-lg" />
                  </div>
                ))
              : tables.map((table) => {
                const tableOrdersArray = tableOrders.get(table.id) || [];
                return (
                  <TableItem
                    key={table.id}
                    table={table}
                    orders={tableOrdersArray}
                    onEdit={() => onEdit(table)}
                    onDelete={() => onDelete(table.id)}
                    onStatusChange={(status) => onStatusChange(table.id, status)}
                  />
                );
              })}
          </div>

          {/* Legend */}
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <div className="flex items-center">
              <div className="w-5 h-5 bg-green-500 rounded-full text-white text-xs flex items-center justify-center mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="9 12 12 15 17 10" />
                </svg>
              </div>
              <span className="text-sm">Disponible</span>
            </div>
            <div className="flex items-center">
              <div className="w-5 h-5 bg-yellow-500 rounded-full text-white text-xs flex items-center justify-center mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12" y2="16" />
                </svg>
              </div>
              <span className="text-sm">Reservada</span>
            </div>
            <div className="flex items-center">
              <div className="w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <span className="text-sm">Ocupada</span>
            </div>
            <div className="flex items-center">
              <div className="w-5 h-5 bg-yellow-500 rounded-full text-white text-xs flex items-center justify-center mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3 w-3"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <span className="text-sm">Esperando comida</span>
            </div>
            <div className="flex items-center">
              <div className="w-5 h-5 bg-blue-500 rounded-full text-white text-xs flex items-center justify-center mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3 w-3"
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
              </div>
              <span className="text-sm">Pago solicitado</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
