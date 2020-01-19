export default ({primary = false, className, children, theme, ...props}) => (
  <button className={`${className} ${primary ? 'primary' : ''} ${primary ? 'primary' : ''}`} {...props}>
    {children}
    <style jsx>{`
      button {
        cursor: pointer;
        color: ${theme.actionTextColor};
        background-color: ${theme.actionColor};
        border-radius: 9999px;
        outline: none;
        padding: 4px 7px;
        border: 0;
        margin-right: 5px;
      }

      button.primary {
        background-color: ${theme.primaryActionColor};
      }

      button:disabled, button.primary:disabled {
        color: ${theme.disabledActionTextColor};
        background-color: ${theme.disabledActionColor};
      }
    `}</style>
  </button>
)
