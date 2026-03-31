import 'package:flutter_test/flutter_test.dart';
import 'package:nere_mobile/main.dart';

void main() {
  testWidgets('App displays welcome message', (WidgetTester tester) async {
    await tester.pumpWidget(const NereApp());
    expect(find.text('Bienvenue dans NERE App Mobile'), findsOneWidget);
  });
}
