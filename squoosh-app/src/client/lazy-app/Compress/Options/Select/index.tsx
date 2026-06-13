import { h, Component } from 'preact';
import * as style from './style.css';
import 'add-css:./style.css';
import { Arrow } from 'client/lazy-app/icons';

type Props = preact.JSX.IntrinsicElements['select'] & { large?: boolean };
interface State {}

export default class Select extends Component<Props, State> {
  render(props: Props) {
    const { large, ...otherProps } = props;

    return (
      <div class={style.select}>
        <select
          class={`${style.builtinSelect} ${large ? style.large : ''}`}
          {...otherProps}
        />
        <div class={style.arrow}>
          <Arrow />
        </div>
      </div>
    );
  }
}
