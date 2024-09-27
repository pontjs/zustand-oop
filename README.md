# zustand-oop

<p align="center">
  <img src="bear-oop.jpg" alt="Zustand OOP Logo" />
</p>

[![Build Status](https://img.shields.io/github/workflow/status/your-username/zustand-oop/CI?style=flat&colorA=000000&colorB=000000)](https://github.com/your-username/zustand-oop/actions?query=workflow%3ACI)
[![Build Size](https://img.shields.io/bundlephobia/minzip/zustand-oop?label=bundle%20size&style=flat&colorA=000000&colorB=000000)](https://bundlephobia.com/result?p=zustand-oop)
[![Version](https://img.shields.io/npm/v/zustand-oop?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/zustand-oop)
[![Downloads](https://img.shields.io/npm/dt/zustand-oop.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/zustand-oop)

Zustand OOP is a library that allows you to use Object-Oriented Programming (OOP) with Zustand. It combines the simplicity and power of Zustand with the structure and familiarity of class-based programming.

## Installation

```bash
npm install zustand-oop
# or
yarn add zustand-oop
```

## Why zustand-oop?

- Combines the simplicity of Zustand with the structure of OOP
- Allows for easy organization of complex state logic
- Familiar syntax for developers coming from class-based backgrounds
- Maintains the performance benefits of Zustand

## Basic Usage

First, create a store class:

```typescript
import { immutable, create } from 'zustand-oop';

@immutable
class BearState {
  bears = 0;

  increasePopulation() {
		this.bears++;
  }

  removeAllBears() {
		this.bears = 0;
  }
}

export const BearStore = create(new BearState());
```

Then use it in your components:

```jsx
function BearCounter() {
  const state = BearStore.useState();
  return <h1>{state.bears} around here ...</h1>;
}

function Controls() {
  const actions = BearStore.useActions();
  return <button onClick={actions.increasePopulation}>one up</button>;
}
```

## Advanced Usage

### combined store

### Combined Store

Zustand OOP allows you to create complex stores by combining multiple state classes. Here's an example using a Todos application:

First, we define the `TodoItem` class to represent individual todo items:

```typescript
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
```

Now, we create the `TodosState` class to manage the collection of todos:

```typescript
import { Type, immutable } from "zustand-oop";

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
```

Finally, we create and export the `TodosStore` using zustand-oop:

```typescript
export const TodosStore = create(
  devtools(
    persist(
      () => new TodosState(),
      {
        name: "todos",
        deserializeClass: TodosState,
      }
    ),
    {
      name: "todos",
    }
  )
);
```

Now that we have our Todos model set up, here are some examples of how to use it in your components:

```jsx
class TodoItemComponentProps {
  todo: TodoItem;
  onDelete?: (id: string) => void;
  className?: string;
}

function TodoItemComponent(props: TodoItemComponentProps) {
	const { todo, onDelete } = props;
  const itemActions = TodosStore.useActions((state) =>
    state.todos?.find((todo) => todo.id === props.todo.id)
  );

  return (
    <div>
      <div className='todo-content'>
        <Checkbox
          checked={todo.completed}
          onChange={(checked) => {
            itemActions.setCompleted(checked);
          }}
        />
        <Input
          value={todo.title}
          className='ml-2'
          onChange={itemActions.updateTodoTitle}
        />
      </div>
      <div>
        <DatePicker
          value={todo.deadline}
          format={"YYYY-MM-DD HH"}
          showTime
          onChange={itemActions.updateTodoDeadline}
        ></DatePicker>
      </div>
      <div className='separator'></div>
      <div className='ops'>
        <Button
          onClick={() => {
            onDelete(todo.id);
          }}
        >
					delete
        </Button>
      </div>
    </div>
  );
}

function Todos() {
  const [store, actions] = TodosStore.useStore();
  const [createTodoVisible, setCreateTodoVisible] = React.useState(false);

  return (
    <div>
      <div className='headers'>
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
            create todo
          </Button>
          <Button
            className='ml-2'
            onClick={() => {
              actions.completeAll();
            }}
          >
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
    </div>
  );
}
```


#### DevTools

Zustand OOP works seamlessly with Redux DevTools, allowing you to inspect and debug your state changes. Here are some examples of how it looks in action:

devtools:

![](https://img.alicdn.com/imgextra/i4/O1CN01FvcxQz1zjYRHGTbqP_!!6000000006750-0-tps-1376-388.jpg)

todos app:

![](https://img.alicdn.com/imgextra/i3/O1CN01hjlqy71E7HOkwkclO_!!6000000000304-0-tps-726-196.jpg)


### Computed Properties

Zustand OOP supports computed properties using getter methods:

```typescript
@immutable
class AdvancedBearState {
  bears = 0;
  fish = 0;

  get bearsPerFish() {
    return this.fish === 0 ? 0 : this.bears / this.fish;
  }

  addBear() {
		this.bears++;
  }

  addFish() {
		this.fish++;
  }
}

export const AdvancedBearStore = create(new AdvancedBearState());
```

### Async Actions

Async actions are straightforward with zustand-oop:

```typescript
@immutable
class AsyncBearState {
  bears = 0;

  async fetchBears() {
    const response = await fetch('/api/bears');
    const bears = await response.json();
		this.bears = bears;
  }
}

export const AsyncBearStore = create(new AsyncBearState());
```

## Middleware Support

Zustand OOP supports Zustand middleware. Here's an example using the `persist` middleware:

```typescript
import { persist, devtools, immutable, create } from 'zustand-oop';

@immutable
class PersistentBearState {
  bears = 0;

  addBear() {
    this.bears++;
  }
}

export const PersistentBearStore = create(
  devtools(
    persist(
      new PersistentBearState(),
      {
        name: "bear-storage",
        deserializeClass: PersistentBearState,
      }
    ),
    { name: "bear-storage" }
  )
);
```

## TypeScript Support

Zustand OOP is written in TypeScript and provides full type support out of the box.

## Best Practices

- Organize your stores into logical classes
- Use computed properties for derived state
- Leverage TypeScript for better type safety and autocompletion

## Contributing

We welcome contributions!

## License

Zustand OOP is [MIT licensed](LICENSE).
