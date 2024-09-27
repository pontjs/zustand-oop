/**
 * @author
 * @description
 */
import * as React from "react";
import moment from "moment";
import {
  Button,
  Checkbox,
  DatePicker,
  Input,
  Modal,
} from "@arco-design/web-react";
import { IconEdit, IconDelete } from "@arco-design/web-react/icon";
import { TodoItem, TodosStore } from "./Todos.model";

export class TodoItemComponentProps {
  todo: TodoItem;
  onDelete?: (id: string) => void;
  className?: string;
}

export const TodoItemComponent: React.FC<TodoItemComponentProps> = React.memo(
  (props) => {
    const [todoItem, itemActions] = TodosStore.useStore((state) =>
      state.todos?.find((todo) => todo.id === props.todo.id)
    );

    return (
      <div className={`todo-item flex ${props.className || ""} border p-3`}>
        <div className='todo-content text-left flex-1 mr-3 flex items-center'>
          <Checkbox
            checked={todoItem.completed}
            onChange={(checked) => {
              itemActions.setCompleted(checked);
            }}
          />
          <Input
            value={props.todo?.title}
            className='ml-2'
            onChange={itemActions.updateTodoTitle}
          />
        </div>
        <div className='todo-deadline w-[200px] flex items-center'>
          <DatePicker
            value={props.todo.deadline}
            format={"YYYY-MM-DD HH"}
            showTime
            onChange={itemActions.updateTodoDeadline}
          ></DatePicker>
        </div>
        <div className='sepline w-[1px] bg-[#e0e0e0] mx-2'></div>
        <div className='ops w-[30px] flex'>
          <Button
            className='px-2'
            onClick={() => {
              props.onDelete(props.todo.id);
            }}
          >
            <IconDelete />
          </Button>
        </div>
      </div>
    );
  }
);

TodoItemComponent.defaultProps = new TodoItemComponentProps();
