/**
 * @author
 * @description
 */
import * as React from "react";
import { TodosStore } from "./Todos.model";
import { TodoItemComponent } from "./TodoItem.component";
import { Button, Input, Modal } from "@arco-design/web-react";
import { AddTodoModal } from "./AddTodoModal";
import { IconCheck } from "@arco-design/web-react/icon";

export class TodosRootProps {}

export const TodosRoot: React.FC<TodosRootProps> = (props) => {
  const [store, actions] = TodosStore.useStore();
  const [createTodoVisible, setCreateTodoVisible] = React.useState(false);

  return (
    <div className='todos-root flex-1'>
      <div className='headers flex items-center justify-between'>
        <div className='flex items-center'>
          search todo:
          <Input
            value={store.keyword}
            placeholder='input todo keyword please'
            className='w-[200px] ml-2'
            onChange={(value) => {
              actions.setKeywords(value);
            }}
          />
        </div>
        <div className='buttons'>
          <Button
            onClick={() => {
              setCreateTodoVisible(true);
            }}
          >
            + add todo
          </Button>
          <Button
            className='ml-2'
            onClick={() => {
              actions.completeAll();
            }}
          >
            <IconCheck />
            complete all
          </Button>
        </div>
      </div>
      <div className='list'>
        {store.filteredTodos.map((todo, index) => {
          return (
            <TodoItemComponent
              onDelete={actions.deleteTodo}
              className='mt-2'
              key={todo.id}
              todo={todo}
            />
          );
        })}
      </div>
      <AddTodoModal
        visible={createTodoVisible}
        onCancel={() => {
          setCreateTodoVisible(false);
        }}
        onOk={(title) => {
          actions.addTodo(title);
          setCreateTodoVisible(false);
        }}
      />
    </div>
  );
};

TodosRoot.defaultProps = new TodosRootProps();
