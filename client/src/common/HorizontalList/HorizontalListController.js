import React, { Component } from 'react'
import HorizontalListItem from './HorizontalListItem'

const quickEquals = (array1, array2) => {
  if (!array1) return false
  if (!array2) return false
  if (array1.length !== array2.length) return false
  for (let i = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) return false
  }
  return true
}

export default class HorizontalListController extends Component {
  horizontalScrollRef = React.createRef()

  shouldComponentUpdate(nextProps) {
    return (
      !quickEquals(
        nextProps.delegate.keyForDataSet,
        this.props.delegate.keyForDataSet
      ) || nextProps.selection !== this.props.selection
    )
  }

  componentDidMount() {
    document.addEventListener('mousewheel', this.blockSwipeBack, false)
    document.addEventListener('keydown', this.handleKeyDown)
  }

  componentWillUnmount() {
    document.removeEventListener('mousewheel', this.blockSwipeBack)
    document.removeEventListener('keydown', this.handleKeyDown)
  }

  handleKeyDown = e => {
    const { onSelectionChanged, selection, delegate } = this.props
    const charCode = String.fromCharCode(e.which).toLowerCase()
    const left = Math.max(selection - 1, 0)
    const right = Math.min(selection + 1, delegate.numberOfItems - 1)
    if (e.which === 39) {
      e.preventDefault()
      onSelectionChanged(right)
      const target = document.getElementById(delegate.keyForItemAt(right))
      target.parentNode.scrollLeft = target.offsetLeft
    } else if (e.which === 37) {
      e.preventDefault()
      onSelectionChanged(left)
      const target = document.getElementById(delegate.keyForItemAt(left))
      target.parentNode.scrollLeft = target.offsetLeft
    } else if (charCode === ' ') {
      e.preventDefault()
      onSelectionChanged(right)
      const target = document.getElementById(delegate.keyForItemAt(right))
      target.parentNode.scrollLeft = target.offsetLeft
    }
  }

  blockSwipeBack = e => {
    e.stopPropagation()
    const scrollElement = this.horizontalScrollRef.current
    if (!scrollElement.contains(e.target)) {
      return
    }

    e.preventDefault()
    const max = scrollElement.scrollWidth - scrollElement.offsetWidth
    const scrollPosition =
      Math.abs(e.deltaX) > Math.abs(e.deltaY)
        ? scrollElement.scrollLeft + e.deltaX
        : scrollElement.scrollLeft + e.deltaY
    scrollElement.scrollLeft = Math.max(0, Math.min(max, scrollPosition))
  }

  handleItemSelected = (e, index) => {
    const { onSelectionChanged } = this.props
    onSelectionChanged(index)
  }

  render() {
    const { delegate, selection } = this.props
    return (
      <div
        ref={this.horizontalScrollRef}
        style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          height: '117px',
          display: 'flex',
          overflow: 'auto',
          alignItems: 'center',
          borderTop: '1px solid #dfe3e6'
        }}
      >
        {[...Array(delegate.numberOfItems)].map((_, i) => {
          return (
            <HorizontalListItem
              index={i}
              id={delegate.keyForItemAt(i)}
              key={delegate.keyForItemAt(i)}
              style={{ height: '80px', margin: '0 8px' }}
              onItemSelected={this.handleItemSelected}
              listItem={delegate.cellForItemAt(i, selection === i)}
            />
          )
        })}
      </div>
    )
  }
}
