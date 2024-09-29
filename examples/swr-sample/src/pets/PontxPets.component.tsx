/**
 * @author
 * @description
 */
import * as React from "react";
import { PetsStore } from "./Pets.store";
import { Checkbox, List, Spin, Tag } from "@arco-design/web-react";

export class PetsProps {}

export const Pets: React.FC<PetsProps> = (props) => {
  const store = PetsStore.useState();
  const storeActions = PetsStore.useActions();

  storeActions.pontxPets.useRequest({
    status: store.status,
  });

  return (
    <div>
      <div className='title font-semibold text-2xl'>
        this is a pontx pets sample
      </div>
      <div className='status-bar mt-3'>
        <span className='label mr-2'>pets status: </span>
        <Checkbox.Group
          value={store.status}
          onChange={(status) => {
            storeActions.setStatus(status);
          }}
        >
          <Checkbox value='available'>available</Checkbox>
          <Checkbox value='pending'>pending</Checkbox>
          <Checkbox value='sold'>sold</Checkbox>
        </Checkbox.Group>
      </div>
      <div className='pets-list mt-3 max-h-[500px] overflow-y-auto'>
        <Spin loading={store.pontxPets.loading}>
          <List
            className='min-w-[400px]'
            dataSource={store.pontxPets.data}
            header={<div>total pet cnt: {store.pontxPets.data?.length}</div>}
            render={(item) => {
              return (
                <List.Item key={item.id}>
                  <div className='flex justify-between'>
                    <div className='text-left mr-3 min-w-[120px]'>
                      {item.name}
                    </div>
                    <div className='mr-3'>{item.status}</div>
                    <div className='flex-1 text-right'>
                      {(item.tags || []).map((tag) => {
                        return (
                          <Tag className='mr-2' key={tag?.id}>
                            {tag?.name}
                          </Tag>
                        );
                      })}
                    </div>
                  </div>
                </List.Item>
              );
            }}
          ></List>
        </Spin>
      </div>
    </div>
  );
};

Pets.defaultProps = new PetsProps();
