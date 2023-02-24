import styles from '../styles/Home.module.css';
const classNames = require('classnames');


export const Btn = ({ children, style, disabled, onClick }) => {
    return <button 
        disabled={disabled}
        className={classNames({ 
            [styles.btn]: true,
            [styles.btnStyleOutline]: style == 'outline',
            [styles.btnStylePrimary]: style == 'primary',
            [styles.btnStyleDisabled]: disabled,
        })} 
        onClick={onClick}
    >
        {children}
    </button>
}