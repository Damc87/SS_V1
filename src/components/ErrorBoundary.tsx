import { Component, type ReactNode } from 'react';
import { toast } from 'sonner';

type Props = { children: ReactNode };
type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Renderer error:', error, errorInfo);
    toast.error('Prišlo je do napake v aplikaciji.');
  }

  handleReload = () => {
    this.setState({ hasError: false, message: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white/80 backdrop-blur rounded-2xl border border-border shadow-soft p-6 space-y-3 text-center">
            <div className="text-lg font-semibold text-slate-900">Prišlo je do napake</div>
            <p className="text-sm text-slate-600">{this.state.message ?? 'Nekaj je šlo narobe.'}</p>
            <div className="flex items-center justify-center gap-3">
              <button className="px-4 py-2 rounded-xl bg-primary text-white shadow-soft" onClick={this.handleReload}>
                Osveži
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
