import { Paper, Text, Title } from "@mantine/core";
import styles from "./index.module.css";

export default function NotFound() {
    return (
        <Paper className={styles.card}>
            <Title order={3} className={`${styles.pageTitle} ${styles.title}`}>
                Not Found
            </Title>
            <Text className={styles.text}>The page you entered does not exist.</Text>
        </Paper>
    );
}
