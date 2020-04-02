import React, { useState, useRef } from 'react'
import { getState } from '../model/state'
import { hasChildren } from '../model/analyze'
import useClickOutside from '../util/useClickOutside'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCaretRight } from '@fortawesome/free-solid-svg-icons'
import { Popper, Manager, Reference } from 'react-popper'
import { CopyToClipboard } from 'react-copy-to-clipboard'

export function MenuItem({
  onClick,
  copyToClipboard,
  children,
  submenu,
  theme,
}) {
  const [itemHover, setItemHover] = useState(false)
  const [submenuHover, setSubmenuHover] = useState(false)
  const styles = (
    <style jsx>{`
      div.menu-item {
        background: none;
        display: flex;
        align-items: center;
      }
      div.menu-item button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 8px;
        margin: 0;
        outline: none;
        width: 100%;
        text-align: left;
        color: ${theme.foreground};
        font-family: ${theme.fontFamily};
      }
      div.menu-item:hover {
        background-color: ${theme.menuHighlight};
      }
      div.menu-item {
        padding-right: 3px;
      }
    `}</style>
  )

  return submenu ? (
    <Manager>
      <Reference>
        {({ ref }) => (
          <div
            ref={ref}
            className="menu-item"
            onMouseEnter={() => setItemHover(true)}
            onMouseLeave={() => setItemHover(false)}
          >
            <button onClick={onClick}>{children}</button>
            <FontAwesomeIcon icon={faCaretRight} size="sm" />
            {styles}
          </div>
        )}
      </Reference>
      {(itemHover || submenuHover) &&
        React.cloneElement(submenu, {
          onMouseEnter: () => setSubmenuHover(true),
          onMouseLeave: () => setSubmenuHover(false),
        })}
    </Manager>
  ) : (
    <div className="menu-item">
      {copyToClipboard ? (
        <CopyToClipboard text={copyToClipboard}>
          <button onClick={onClick}>{children}</button>
        </CopyToClipboard>
      ) : (
        <button onClick={onClick}>{children}</button>
      )}
      {styles}
    </div>
  )
}

const defaultPopperProps = {
  placement: 'bottom-start',
  modifiers: { offset: { offset: '8, 3' } },
}

export default ({
  onClose,
  popperProps = defaultPopperProps,
  theme,
  children,
  ...props
}) => {
  const ref = useRef(null)
  useClickOutside(ref, onClose)

  const menuItems = React.Children.map(children, child => {
    return React.isValidElement(child)
      ? React.cloneElement(child, {
          onClick: e => {
            child.props.onClick(e)
            onClose()
          },
          theme,
        })
      : child
  })

  const sortedMenuItems = placement =>
    (placement || '').startsWith('top-') ? [...menuItems].reverse() : menuItems

  return (
    <Popper {...popperProps}>
      {({ ref: popperRef, style, placement }) => (
        <div
          className="popper"
          ref={popperRef}
          style={style}
          data-placement={placement}
          {...props}
        >
          <div className="menu" ref={ref}>
            {sortedMenuItems(placement)}
          </div>
          <style jsx>{`
            .menu {
              background-color: ${theme.menuBackground};
              opacity: 0.95;
              padding: 2px;
              border-radius: 5px;
            }
          `}</style>
        </div>
      )}
    </Popper>
  )
}
