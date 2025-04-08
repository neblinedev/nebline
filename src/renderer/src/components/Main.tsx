export type MainProps = {
  children: React.ReactNode
}

function Main(props: MainProps): JSX.Element {
  return <div className="flex flex-col flex-1 min-w-0 bg-surface-0">{props.children}</div>
}

export default Main
