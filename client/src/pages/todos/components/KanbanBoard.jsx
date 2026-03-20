import React from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import KanbanColumn from "./KanbanColumn";

const KanbanBoard = ({ todos, onMove, onEdit, onDelete, clients, services, staff, onSuccess }) => {
  const columns = [
    { id: "new", title: "New to-dos" },
    { id: "pending", title: "Pending" },
    { id: "completed", title: "Completed" },
  ];

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    onMove(draggableId, destination.droppableId, destination.index);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="kanban-board">
        {columns.map((col) => {
          const columnTodos = todos
            .filter((t) => t.status === col.id)
            .sort((a, b) => a.position - b.position);

          return (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              todos={columnTodos}
              onEdit={onEdit}
              onDelete={onDelete}
              clients={clients}
              services={services}
              staff={staff}
            />
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
