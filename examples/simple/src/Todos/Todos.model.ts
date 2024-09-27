import { create, immutable, Type, devtools, persist } from "zustand-oop";

import { v4 as uuidv4 } from "uuid";
import moment from "moment";

@immutable
export class TodoItem {
  id = uuidv4();
  title = "";
  detail = "";
  completed = false;
  deadline = moment().add(7, "days").format("YYYY-MM-DD HH:mm:ss");

  setCompleted(value: boolean) {
    this.completed = value;
  }

  updateTodoTitle(title: string) {
    this.title = title;
  }

  updateTodoDeadline(deadline: string) {
    this.deadline = deadline;
  }
}

@immutable
class TodosState {
  @Type(() => TodoItem)
  todos = [] as TodoItem[];

  keyword = "";

  setKeywords(value: string) {
    this.keyword = value;
  }

  completeAll() {
    this.todos.forEach((todo) => {
      todo.setCompleted(true);
    });
  }

  addTodo(title: string) {
    const todo = new TodoItem();
    todo.title = title;

    this.todos.push(todo);
  }

  deleteTodo(id: string) {
    this.todos = this.todos.filter((todo) => todo.id !== id);
  }

  get filteredTodos() {
    return this.todos.filter((todo) =>
      todo.title.toLowerCase().includes(this.keyword.toLowerCase())
    );
  }
}

export const TodosStore = create(
  devtools(
    persist(() => new TodosState(), {
      name: "todos",
      deserializeClass: TodosState,
    }),
    {
      name: "todos",
    }
  )
);
