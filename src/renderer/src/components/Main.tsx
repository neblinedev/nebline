export type MainProps = {
  children: React.ReactNode
}

function Main(props: MainProps): JSX.Element {
  return <div className="flex flex-col flex-1 bg-surface-1">{props.children}</div>
}

export default Main
