import { FormBuilderPlayArea } from './components/form-builder'

export default function App() {
  return (
    <div className="flex h-screen w-screen items-center justify-center scroll-smooth bg-neutral-900 text-white antialiased">
      <div className="mx-auto flex w-full max-w-xl flex-col">
        <FormBuilderPlayArea />
      </div>
    </div>
  )
}
