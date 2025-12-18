// "use client";

// import BulkActions from './BulkActions';
// import TicketsTable from './TicketsTable';
// import { useSelection } from './SelectionManager/useSelection';

// interface TicketsPageClientProps {
//   tickets: any[];
//   sessions: any[];
//   hasAnySearch: boolean;
//   hasAnyFilter: boolean;
//   buildQueryString: (updates: any) => string;
// }

// export default function TicketsPageClient({
//   tickets,
//   sessions,
//   hasAnySearch,
//   hasAnyFilter,
//   buildQueryString,
// }: TicketsPageClientProps) {
//   const selection = useSelection({ tickets });

//   return (
//     <>
//       <BulkActions
//         tickets={tickets}
//         selectedIds={selection.selectedIds}
//         onClearSelection={selection.clearSelection}
//       />
      
//       <TicketsTable
//         tickets={tickets}
//         sessions={sessions}
//         hasAnySearch={hasAnySearch}
//         hasAnyFilter={hasAnyFilter}
//         buildQueryString={buildQueryString}
//         selection={{
//           isAllSelected: selection.isAllSelected,
//           isSelected: selection.isSelected,
//           selectAll: selection.selectAll,
//           toggleTicket: selection.toggleTicket,
//         }}
//       />
//     </>
//   );
// }