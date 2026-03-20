import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import TodoCard from "./TodoCard";

const KanbanColumn = ({ id, title, todos, onEdit, onDelete, clients, services, staff, onSuccess }) => {
  return (
    <div className="kanban-column">
      <div className="column-header">
        <h2 className="column-title">{title}</h2>
        <span className="card-count">{todos.length}</span>
      </div>

      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            className={`task-list ${snapshot.isDraggingOver ? "dragging-over" : ""}`}
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {todos.map((todo, index) => (
              <TodoCard
                key={todo._id}
                todo={todo}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
                clients={clients}
                services={services}
                staff={staff}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
