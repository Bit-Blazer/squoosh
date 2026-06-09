import { h, Component } from 'preact';
import * as style from './style.css';
import 'add-css:./style.css';
import { UncheckedIcon, CheckedIcon } from '../../../icons';

interface Props extends preact.JSX.HTMLAttributes<HTMLInputElement> {}
interface State {}

export default class Checkbox extends Component<Props, State> {
  render(props: Props) {
    return (
      <div class={style.checkbox}>
        {props.checked ? (
          props.disabled ? (
            <CheckedIcon class={`${style.icon} ${style.disabled}`} />
          ) : (
            <CheckedIcon class={`${style.icon} ${style.checked}`} />
          )
        ) : (
          <UncheckedIcon class={style.icon} />
        )}
        <input class={style.realCheckbox} type="checkbox" {...props} />
      </div>
    );
  }
}
