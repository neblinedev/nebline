export type MainProps = {
  children: React.ReactNode
}

function Main(props: MainProps): JSX.Element {
  return <div className="flex-1 p-6 bg-surface-1">{props.children}</div>
}

export default Main
