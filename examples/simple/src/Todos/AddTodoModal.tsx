/**
 * @author
 * @description
 */
import { Input, Modal } from "@arco-design/web-react";
import * as React from "react";

export class AddTodoModalProps {
  visible = false;
  onOk: (title: string) => void = () => {};
  onCancel: () => void = () => {};
}

export const AddTodoModal: React.FC<AddTodoModalProps> = (props) => {
  const [title, setTitle] = React.useState("");

  return (
    <Modal
      title='create todo'
      visible={props.visible}
      onCancel={() => {
        props.onCancel();
      }}
      onOk={() => {
        props.onOk(title);
      }}
    >
      <div className='label'>todo title</div>
      <Input
        value={title}
        onChange={(val) => {
          setTitle(val);
        }}
      />
    </Modal>
  );
};

AddTodoModal.defaultProps = new AddTodoModalProps();
