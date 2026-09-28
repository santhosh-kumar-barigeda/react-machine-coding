import { TabsPlayArea } from './components/tabs'

export default function App() {
  return (
    <div className="flex h-screen w-screen items-center justify-center scroll-smooth bg-neutral-900 text-white antialiased">
      <div className="mx-auto flex w-full max-w-xl flex-col">
        <TabsPlayArea />
      </div>
    </div>
  )
}
