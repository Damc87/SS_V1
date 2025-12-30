import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export function StyleGuide() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardDescription>Gumbi</CardDescription>
          <CardTitle>Glavni in sekundarni</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button variant="primary">Primarni</Button>
          <Button variant="secondary">Sekundarni</Button>
        </CardContent>
      </Card>
    </div>
  );
}
