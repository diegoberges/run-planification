export default function Container({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <section className="max-w-2xl mx-auto min-h-screen flex items-center justify-center">
      {children}
    </section>
  );
}
